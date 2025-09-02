import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Container } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { styled } from '@mui/system';
import correctSound from '../assets/sounds/correct.mp3';
import incorrectSound from '../assets/sounds/incorrect.mp3';
import statsimg from "../assets/voilet.png";
import { infoSectionStyles, infoBoxStyles, gameButtonStyles } from './Theme';
import axios from 'axios';

const InfoSection = styled('div')(infoSectionStyles);
const InfoBox = styled('div')(infoBoxStyles);
const GameButton = styled(Button)(gameButtonStyles);

const theme = createTheme({
  palette: {
    primary: {
      main: '#7f60d4',
    },
    secondary: {
      main: '#5e45a0',
    },
    background: {
      default: '#f5f3ff',
      paper: '#ffffff',
    },
  },
});

function VisualMemoryTest() {
  const [level, setLevel] = useState(1);
  const [gridSize, setGridSize] = useState(3);
  const [grid, setGrid] = useState(Array(9).fill(false));
  const [highlighted, setHighlighted] = useState([]);
  const [stage, setStage] = useState('start');
  const [userSelection, setUserSelection] = useState([]);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState('');
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    if (level >= 1 && level <= 3) { setGridSize(3); }
    else if (level >= 4 && level <= 8) { setGridSize(4); }
    else if (level >= 9 && level <= 15) { setGridSize(5); }
    else { setGridSize(6); }
  }, [level]);

  useEffect(() => {
    setGrid(Array(gridSize * gridSize).fill(false));
    setHighlighted([]);
    setUserSelection([]);
  }, [gridSize]);
  
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

      // 2. Update ONLY the data for the specific test you just played
      const score = level - 1; // Or whatever the score is for that game
      const testData = currentTestResults.visualMemory || { noOfTests: 0, total: 0, min: Infinity, max: 0, avg: 0 };
      
      const newNoOfTests = testData.noOfTests + 1;
      const newTotal = testData.total + score;
      const newMin = Math.min(testData.min, score);
      const newMax = Math.max(testData.max, score);
      const newAvg = newTotal / newNoOfTests;

      // Make sure to use the correct test name here (e.g., 'visualMemory', 'aimTrainer')
      currentTestResults.visualMemory = {
        noOfTests: newNoOfTests,
        total: newTotal,
        min: newMin,
        max: newMax,
        avg: newAvg,
      };
      
      // 3. Send the complete, up-to-date object back to the server
      await axios.patch(`http://localhost:5000/users/${userId}`, {
        testResults: currentTestResults,
      });

      console.log('Test results saved successfully');
    } catch (error) {
      console.error('Error saving test results:', error);
    }
  };
  const startGame = () => {
    setStage('memorizing');
    generateHighlightedSquares();
  };

  const generateHighlightedSquares = () => {
    const newHighlighted = [];
    while (newHighlighted.length < level + 2) { // Number of squares to memorize
      const randomIndex = Math.floor(Math.random() * gridSize * gridSize);
      if (!newHighlighted.includes(randomIndex)) {
        newHighlighted.push(randomIndex);
      }
    }
    setHighlighted(newHighlighted);
    setGrid(prevGrid => prevGrid.map((_, index) => newHighlighted.includes(index)));
    
    setTimeout(() => {
      setGrid(Array(gridSize * gridSize).fill(false));
      setStage('input');
    }, 2000);
  };

  const handleSquareClick = (index) => {
    if (stage !== 'input' || userSelection.includes(index)) return;

    const newUserSelection = [...userSelection, index];
    setUserSelection(newUserSelection);

    const isCorrect = highlighted.includes(index);
    const audio = new Audio(isCorrect ? correctSound : incorrectSound);
    audio.play();

    setGrid(prevGrid => prevGrid.map((val, i) => (i === index ? isCorrect : val)));

    setTimeout(() => {
        setGrid(prevGrid => prevGrid.map((val, i) => (i === index ? false : val)));
    }, 300);

    if (!isCorrect) {
      saveTestResults();
      setMessage(`Incorrect! You reached level ${level}.`);
      setStage('failed');
      return;
    }
    
    if (newUserSelection.length === highlighted.length) {
      setMessage('Correct! Moving to next level.');
      setTimeout(() => {
        setLevel(prevLevel => prevLevel + 1);
        setUserSelection([]);
        setHighlighted([]);
        setMessage('');
        setStage('memorizing');
      }, 1000);
    }
  };
  
  useEffect(() => {
    if (stage === 'memorizing' && !highlighted.length) {
      generateHighlightedSquares();
    }
  }, [stage, highlighted, level]);

  const resetGame = () => {
    setLevel(1);
    setUserSelection([]);
    setHighlighted([]);
    setMessage('');
    setStage('start');
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Visual Memory Test - Level {level}
          </Typography>

          <Box sx={{ height: '80px', mb: 2 }}>
            {message && (
              <Typography variant="h6" color="secondary" sx={{ mb: 2 }}>
                {message}
              </Typography>
            )}
            {stage === 'start' && (
              <GameButton variant="contained" color="primary" onClick={startGame}>
                Start Game
              </GameButton>
            )}
            {stage === 'failed' && (
              <GameButton variant="contained" color="secondary" onClick={resetGame}>
                Play Again
              </GameButton>
            )}
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gap: { xs: '5px', sm: '10px' },
              width: '80%',
              aspectRatio: '1',
              margin: '0 auto',
            }}
          >
            {grid.map((isHighlighted, index) => (
              <Box
                key={index}
                sx={{
                  aspectRatio: '1',
                  backgroundColor: isHighlighted ? '#d4eaad' : theme.palette.primary.main,
                  cursor: stage === 'input' ? 'pointer' : 'default',
                  transition: 'background-color 0.3s ease, transform 0.2s ease',
                  borderRadius: '8px',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                  '&:hover': {
                    backgroundColor: stage === 'input' ? theme.palette.primary.light : null,
                    transform: stage === 'input' ? 'scale(1.05)' : null,
                  },
                }}
                onClick={() => handleSquareClick(index)}
              />
            ))}
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default VisualMemoryTest;