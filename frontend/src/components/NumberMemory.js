import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, TextField, LinearProgress, Container, Grid, useMediaQuery, Link } from '@mui/material';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import statsimg from "../assets/voilet.png";
import { theme, infoSectionStyles, infoBoxStyles, gameButtonStyles } from './Theme';
import axios from 'axios';

const InfoSection = styled('div')(infoSectionStyles);
const InfoBox = styled('div')(infoBoxStyles);
const GameButton = styled(Button)(gameButtonStyles);

const NumberDisplay = styled(Typography)(({ theme }) => ({
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

const NumberMemory = () => {
  const [level, setLevel] = useState(1);
  const [number, setNumber] = useState('');
  const [userInput, setUserInput] = useState('');
  const [showNumber, setShowNumber] = useState(false);
  const [testOver, setTestOver] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [progress, setProgress] = useState(100);
  const [userId, setUserId] = useState('');
  const [testResults, setTestResults] = useState([]);

  const generateNumber = (len) => {
    let generated = '';
    for (let i = 0; i < len; i++) {
      generated += Math.floor(Math.random() * 10);
    }
    return generated;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) { return; }
        const parsedUser = JSON.parse(storedUser);
        const userId = parsedUser._id;
        if (!userId) { return; }
        setUserId(userId);

        const response = await axios.get(`https://yourbenchmark.onrender.com/users/${userId}`);
        setTestResults(response.data.testResults);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);

  const saveTestResults = async () => {
    try {
      // 1. ALWAYS get the latest user data from the server first
      const response = await axios.get(`http://localhost:5000/users/${userId}`);
      const currentTestResults = response.data.testResults || {};

      // 2. Your existing logic for calculating the new score
      const numberMemoryData = currentTestResults.numberMemory || { noOfTests: 0, total: 0, min: Infinity, max: 0, avg: 0 };

      const score = level - 1;
      const newNoOfTests = numberMemoryData.noOfTests + 1;
      const newTotal = numberMemoryData.total + score;
      const newMin = Math.min(numberMemoryData.min, score);
      const newMax = Math.max(numberMemoryData.max, score);
      const newAvg = newTotal / newNoOfTests;
      
      currentTestResults.numberMemory = {
        noOfTests: newNoOfTests,
        total: newTotal,
        min: newMin,
        max: newMax,
        avg: newAvg,
      };

      // 3. Send the complete, up-to-date object back to the server
      const updatedUserResponse = await axios.patch(`http://localhost:5000/users/${userId}`, {
        testResults: currentTestResults,
      });

      // 4. (Optional but recommended) Update localStorage with the fresh user data
      localStorage.setItem('user', JSON.stringify(updatedUserResponse.data));

      console.log('Test results saved successfully');
    } catch (error){
      console.error('Error saving test results:', error);
    }
  };

  const startTest = (currentLevel) => {
    setTestStarted(true);
    const newNumber = generateNumber(currentLevel);
    setNumber(newNumber);
    setShowNumber(true);
    
    const duration = 2000 + (currentLevel - 1) * 700;
    setProgress(100);
    
    setTimeout(() => {
      setShowNumber(false);
    }, duration);

    // Progress bar logic
    let progressInterval = setInterval(() => {
        setProgress(prev => {
            if (prev <= 0) {
                clearInterval(progressInterval);
                return 0;
            }
            return prev - (100 / (duration / 100));
        });
    }, 100);
  };
  
  const handleSubmit = () => {
    if (userInput === number) {
      const nextLevel = level + 1;
      setLevel(nextLevel);
      setUserInput('');
      startTest(nextLevel);
    } else {
      saveTestResults();
      setTestOver(true);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (!showNumber && testStarted && !testOver) {
        handleSubmit();
      }
    }
  };

  const restartTest = () => {
    setLevel(1);
    setTestOver(false);
    setUserInput('');
    startTest(1);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [showNumber, testStarted, testOver, userInput, number]);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="sm">
          <Box sx={{ textAlign: 'center', py: 4 }}>
            {!testOver ? (
              <>
                <Typography variant="h3" gutterBottom fontWeight="bold" color="primary">
                  Number Memory
                </Typography>
                <LevelDisplay variant="h6" gutterBottom>
                  Level {level}
                </LevelDisplay>
                {showNumber ? (
                  <>
                    <NumberDisplay variant="h3" gutterBottom>
                      {number}
                    </NumberDisplay>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      sx={{ width: '80%', margin: '20px auto', height: 10 }}
                    />
                  </>
                ) : (
                  <>
                    {testStarted && (
                      <Grid container direction="column" spacing={2} alignItems="center">
                        <Grid item>
                          <Typography variant="h5" gutterBottom>
                            What was the number?
                          </Typography>
                        </Grid>
                        <Grid item>
                          <TextField
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            variant="outlined"
                            placeholder="Enter the number"
                            inputProps={{
                              style: { textAlign: 'center', fontSize: '24px' },
                              autoFocus: true
                            }}
                          />
                        </Grid>
                        <Grid item>
                          <GameButton variant="contained" color="primary" onClick={handleSubmit}>
                            Submit
                          </GameButton>
                        </Grid>
                      </Grid>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
                  Test Over!
                </Typography>
                <Typography variant="h5">
                  You reached Level {level - 1}
                </Typography>
                <GameButton variant="contained" color="primary" onClick={restartTest} sx={{ mt: 2 }}>
                  Restart
                </GameButton>
              </>
            )}
            {!testStarted && (
              <GameButton variant="contained" color="primary" onClick={() => startTest(level)} size="large">
                Start Game
              </GameButton>
            )}
          </Box>
        </Container>
        <InfoSection>
          <InfoBox>
             <Typography variant="h6" gutterBottom>About the test</Typography>
             <Typography paragraph>
               The average person can only remember 7 digit numbers reliably, but it's possible to do much better using mnemonic techniques.
             </Typography>
          </InfoBox>
           <InfoBox>
            <Typography variant="h6" gutterBottom>Statistics</Typography>
            <img src={statsimg} alt="Statistics" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }} />
          </InfoBox>
        </InfoSection>
      </Box>
    </ThemeProvider>
  );
};

export default NumberMemory;