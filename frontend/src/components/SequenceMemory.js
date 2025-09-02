import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, TextField, LinearProgress, Container, Grid } from '@mui/material';
import { styled, ThemeProvider } from '@mui/material/styles';
import { theme, infoSectionStyles, infoBoxStyles, gameButtonStyles } from './Theme';
import statsimg from "../assets/voilet.png";
import axios from 'axios';

const InfoSection = styled('div')(infoSectionStyles);
const InfoBox = styled('div')(infoBoxStyles);
const GameButton = styled(Button)(gameButtonStyles);

const LetterDisplay = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(3),
  userSelect: 'none',
}));

const LevelDisplay = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  color: theme.palette.secondary.main,
  marginTop: theme.spacing(2),
}));

const SequenceMemory = () => {
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [gameState, setGameState] = useState('start'); // 'start', 'showing', 'input', 'over'
  const [progress, setProgress] = useState(100);
  const [userId, setUserId] = useState('');
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;
        const parsedUser = JSON.parse(storedUser);
        const userId = parsedUser._id;
        if (!userId) return;
        setUserId(userId);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    };
    fetchUserData();
  }, []);

  const saveTestResults = async (score) => {
    try {
      const response = await axios.get(`http://localhost:5000/users/${userId}`);
      const currentTestResults = response.data.testResults || {};
      const sequenceMemoryData = currentTestResults.sequenceMemory || { noOfTests: 0, total: 0, min: Infinity, max: 0, avg: 0 };
      
      const newNoOfTests = sequenceMemoryData.noOfTests + 1;
      const newTotal = sequenceMemoryData.total + score;
      const newMin = Math.min(sequenceMemoryData.min, score);
      const newMax = Math.max(sequenceMemoryData.max, score);
      const newAvg = newTotal / newNoOfTests;

      currentTestResults.sequenceMemory = { noOfTests: newNoOfTests, total: newTotal, min: newMin, max: newMax, avg: newAvg };

      const updatedUserResponse = await axios.patch(`http://localhost:5000/users/${userId}`, { testResults: currentTestResults });
      localStorage.setItem('user', JSON.stringify(updatedUserResponse.data));
      console.log('Test results saved successfully');
    } catch (error) {
      console.error('Error saving test results:', error);
    }
  };

  const generateRandomLetter = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';
    return letters.charAt(Math.floor(Math.random() * letters.length));
  };
  
  const nextTurn = () => {
    setGameState('showing');
    // Use functional update to ensure we're using the latest sequence state
    setSequence(prevSequence => [...prevSequence, generateRandomLetter()]); 
  };
  
  useEffect(() => {
    if (gameState === 'showing') {
      const duration = 1500;
      setProgress(100);
      
      const hideTimeout = setTimeout(() => {
        setGameState('input');
      }, duration);
      
      const progressInterval = setInterval(() => {
        setProgress(prev => (prev <= 0 ? 0 : prev - (100 / (duration / 100))));
      }, 100);
      
      return () => {
        clearTimeout(hideTimeout);
        clearInterval(progressInterval);
      };
    }
  }, [sequence, gameState]); // Effect depends on the sequence changing

  const handleSubmit = () => {
    // Add console logs for debugging
    // console.log(`Your Input: "${userInput.toUpperCase()}"`);
    // console.log(`Correct Sequence: "${sequence.join('')}"`);

    if (userInput.toUpperCase() === sequence.join('')) {
      setLevel(prevLevel => prevLevel + 1);
      setUserInput('');
      nextTurn();
    } else {
      const finalScore = level - 1;
      saveTestResults(finalScore);
      setGameState('over');
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && gameState === 'input') {
      handleSubmit();
    }
  };

  const startGame = () => {
    setLevel(1);
    setSequence([]);
    setUserInput('');
    setGameState('start'); // Go to start screen, then first turn
    // A small timeout to allow state to reset before first turn
    setTimeout(() => nextTurn(), 100); 
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [gameState, userInput, sequence]); // Rerun when these change

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="sm">
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h3" gutterBottom fontWeight="bold" color="primary">Sequence Memory</Typography>
            
            {gameState === 'start' && (
                 <GameButton variant="contained" color="primary" onClick={startGame} size="large">Start Game</GameButton>
            )}

            {(gameState === 'showing' || gameState === 'input') && (
              <>
                <LevelDisplay variant="h6" gutterBottom>Level {level}</LevelDisplay>
                {gameState === 'showing' ? (
                  <>
                    <LetterDisplay variant="h3" gutterBottom>{sequence[sequence.length - 1]}</LetterDisplay>
                    <LinearProgress variant="determinate" value={progress} sx={{ width: '80%', margin: '20px auto', height: 10 }}/>
                  </>
                ) : (
                  <Grid container direction="column" spacing={2} alignItems="center">
                    <Grid item><Typography variant="h5" gutterBottom>What was the sequence?</Typography></Grid>
                    <Grid item>
                      <TextField
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        variant="outlined"
                        placeholder="Enter the sequence"
                        inputProps={{ style: { textAlign: 'center', fontSize: '24px' }, autoFocus: true }}
                      />
                    </Grid>
                    <Grid item><GameButton variant="contained" color="primary" onClick={handleSubmit}>Submit</GameButton></Grid>
                  </Grid>
                )}
              </>
            )}

            {gameState === 'over' && (
              <>
                <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">Test Over!</Typography>
                <Typography variant="h5">You successfully completed {level - 1} levels.</Typography>
                <GameButton variant="contained" color="primary" onClick={startGame} sx={{ mt: 2 }}>Restart</GameButton>
              </>
            )}
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default SequenceMemory;