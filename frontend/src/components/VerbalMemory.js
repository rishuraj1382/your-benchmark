import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Container, Grid, ThemeProvider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link } from '@mui/material';
import statsimg from "../assets/voilet.png";
import axios from 'axios';
import { theme, infoSectionStyles, infoBoxStyles, gameButtonStyles, wordDisplayStyles, scoreDisplayStyles } from './Theme';

const InfoSection = styled('div')(infoSectionStyles);
const InfoBox = styled('div')(infoBoxStyles);
const GameButton = styled(Button)(gameButtonStyles);
const WordDisplay = styled(Typography)(wordDisplayStyles);
const ScoreDisplay = styled(Typography)(scoreDisplayStyles);

const VerbalMemory = () => {
  const [started, setStarted] = useState(false);
  const [word, setWord] = useState('');
  const [oldWords, setOldWords] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [userId, setUserId] = useState('');
  const [testResults, setTestResults] = useState([]);

  const wordList = [
    'apple', 'banana', 'grape', 'orange', 'pineapple', 'dog', 'cat', 'mouse', 'elephant', 'giraffe',
    'house', 'car', 'tree', 'flower', 'book', 'computer', 'phone', 'table', 'chair', 'window',
    'door', 'pencil', 'pen', 'notebook', 'backpack', 'shoe', 'shirt', 'pants', 'hat', 'glasses',
    'watch', 'clock', 'lamp', 'picture', 'painting', 'television', 'radio', 'camera', 'guitar', 'piano',
    'drum', 'violin', 'flute', 'trumpet', 'saxophone', 'mountain', 'river', 'ocean', 'lake', 'forest',
    'desert', 'island', 'beach', 'sun', 'moon', 'star', 'planet', 'galaxy', 'universe', 'cloud',
    'rain', 'snow', 'wind', 'thunder', 'lightning', 'rainbow', 'fire', 'water', 'earth', 'air',
    'metal', 'wood', 'plastic', 'glass', 'paper', 'cotton', 'silk', 'leather', 'rubber', 'stone',
    'diamond', 'gold', 'silver', 'bronze', 'iron', 'steel', 'copper', 'aluminum', 'titanium', 'platinum',
    'hydrogen', 'oxygen', 'carbon', 'nitrogen', 'helium', 'neon', 'argon', 'krypton', 'xenon', 'radon'
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) { return; }
        const parsedUser = JSON.parse(storedUser);
        const userId = parsedUser._id;
        if (!userId) { return; }
        setUserId(userId);

        const response = await axios.get(`http://localhost:5000/users/${userId}`);
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

      // 2. Your existing logic for calculating the new score (this part is correct)
      const verbalMemoryData = currentTestResults.verbalMemory || { noOfTests: 0, total: 0, min: Infinity, max: 0, avg: 0 };
      
      const newNoOfTests = verbalMemoryData.noOfTests + 1;
      const newTotal = verbalMemoryData.total + score;
      const newMin = Math.min(verbalMemoryData.min, score);
      const newMax = Math.max(verbalMemoryData.max, score);
      const newAvg = newTotal / newNoOfTests;

      currentTestResults.verbalMemory = {
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

      // 4. (Optional but recommended) Update localStorage with the fresh user data from the server
      localStorage.setItem('user', JSON.stringify(updatedUserResponse.data));

      console.log('Test results saved successfully');
    } catch (error) {
      console.error('Error saving test results:', error);
    }
  };

  const generateWord = () => {
    const repetitionProbability = 0.4;
    let newWord;

    if (oldWords.length > 0 && Math.random() < repetitionProbability) {
      do {
        const randomIndex = Math.floor(Math.random() * oldWords.length);
        newWord = oldWords[randomIndex];
      } while (newWord === word);
    } else {
      do {
        const randomIndex = Math.floor(Math.random() * wordList.length);
        newWord = wordList[randomIndex];
      } while (newWord === word);
    }
    return newWord;
  };

  const startGame = () => {
    setStarted(true);
    setGameOver(false);
    setOldWords([]);
    setScore(0);
    setWord(generateWord());
  };

  const handleNew = () => {
    if (oldWords.includes(word)) {
      endGame();
    } else {
      setOldWords([...oldWords, word]);
      setScore(prevScore => prevScore + 1);
      setWord(generateWord());
    }
  };

  const handleOld = () => {
    if (!oldWords.includes(word)) {
      endGame();
    } else {
      setOldWords([...oldWords, word]);
      setScore(prevScore => prevScore + 1);
      setWord(generateWord());
    }
  };

  const endGame = () => {
    setGameOver(true);
    saveTestResults();
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="sm">
          <Box sx={{ textAlign: 'center', py: 4, minHeight: '300px' }}>
            {!started ? (
              <>
                <Typography variant="h3" gutterBottom fontWeight="bold" color="primary">
                  Verbal Memory
                </Typography>
                <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
                  You will be shown words, one by one. If you've seen a word before, click SEEN. If it's a new word, click NEW.
                </Typography>
                <GameButton variant="contained" color="primary" onClick={startGame} size="large">
                  Start
                </GameButton>
              </>
            ) : gameOver ? (
              <>
                <Typography variant="h3" gutterBottom fontWeight="bold" color="primary">
                  Game Over
                </Typography>
                <Typography variant="h5" gutterBottom>
                  Your final score: {score}
                </Typography>
                <GameButton variant="contained" color="primary" onClick={startGame}>
                  Play Again
                </GameButton>
              </>
            ) : (
              <Grid container direction="column" spacing={2} alignItems="center">
                <Grid item>
                  <WordDisplay variant="h2">{word}</WordDisplay>
                </Grid>
                <Grid item>
                  <GameButton variant="contained" color="primary" onClick={handleNew}>
                    New
                  </GameButton>
                  <GameButton variant="contained" color="secondary" onClick={handleOld}>
                    Seen
                  </GameButton>
                </Grid>
                <Grid item>
                  <ScoreDisplay variant="h6">Score: {score}</ScoreDisplay>
                </Grid>
              </Grid>
            )}
          </Box>
        </Container>
        <InfoSection>
          <InfoBox>
            <Typography variant="h6" gutterBottom>About the test</Typography>
            <Typography paragraph>
              This test measures how many words you can keep in short-term memory at once.
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

export default VerbalMemory;