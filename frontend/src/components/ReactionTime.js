import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import axios from 'axios';

const Container = styled('div')({
  textAlign: 'center',
  marginTop: '0px',
  padding: '0px',
  width: '100%',
  minHeight: '100%',
  backgroundColor: '#f5f3ff',
  overflow: 'auto',
});

const Header = styled('div')(({ theme, isMobile }) => ({
  backgroundColor: '#f5f3ff',
  color: '#7f60d4',
  padding: isMobile ? '30px 10px' : '50px 20px',
  textAlign: 'center',
}));

const Title = styled('h1')(({ isMobile }) => ({
  margin: 0,
  fontSize: isMobile ? '2rem' : '2.5rem',
}));

const Instructions = styled('p')(({ isMobile }) => ({
  marginTop: '10px',
  fontSize: isMobile ? '1rem' : '1.2rem',
}));

const TestArea = styled('div')(({ theme, waiting, isMobile }) => ({
  margin: isMobile ? '30px auto' : '50px auto',
  width: isMobile ? '90%' : '600px',
  height: isMobile ? '150px' : '300px',
  backgroundColor: waiting ? "#f34212" : '#7f60d4',
  cursor: waiting ? 'default' : 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: isMobile ? '1rem' : '1.5rem',
  color: 'white',
  borderRadius: '8px',
  maxHeight: '300px',
  maxWidth: '600px',
  minHeight: '250px',
}));

const InfoSection = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: '20px',
  color: '#7f60d4',
  maxHeight: '300px',
  minHeight: '250px',
}));

const InfoBox = styled('div')(({ theme, isMobile }) => ({
  alignSelf: 'center',
  width: isMobile ? '90%' : '300px',
  maxWidth: '600px',
  padding: '20px',
  color: 'black',
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  margin: '20px',
  textAlign: 'left',
  transition: 'transform 0.3s ease, background-color 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
    backgroundColor: '#e5d6f9',
  },
}));

const ReactionTime = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [waiting, setWaiting] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [reactionTime, setReactionTime] = useState(null);
  const [testCount, setTestCount] = useState(0);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [userId, setUserId] = useState('');
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;
        const parsedUser = JSON.parse(storedUser);
        const userId = parsedUser._id;
        setUserId(userId);

        const response = await axios.get(`https://your-benchmark.onrender.com/users/${userId}`);
        setTestResults(response.data.testResults);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);

  const saveTestResults = async (times) => {
    try {
      const response = await axios.get(`https://your-benchmark.onrender.com/users/${userId}`);
      const currentTestResults = response.data.testResults || {};

      const sum = times.reduce((acc, time) => acc + time, 0);
      const average = sum / times.length;

      const reactionTimeData = currentTestResults.reactionTime || { noOfTests: 0, total: 0, min: Infinity, max: 0, avg: 0 };
      
      const newNoOfTests = reactionTimeData.noOfTests + 1;
      const newTotal = reactionTimeData.total + average;
      const newMin = Math.min(reactionTimeData.min, average);
      const newMax = Math.max(reactionTimeData.max, average);
      const newAvg = newTotal / newNoOfTests;

      currentTestResults.reactionTime = {
          noOfTests: newNoOfTests,
          total: newTotal,
          min: newMin,
          max: newMax,
          avg: newAvg,
      };

      const updatedUserResponse = await axios.patch(`https://your-benchmark.onrender.com/users/${userId}`, {
          testResults: currentTestResults,
      });

      localStorage.setItem('user', JSON.stringify(updatedUserResponse.data));
      console.log('Test results saved successfully');
    } catch (error) {
        console.error('Error saving test results:', error);
    }
  };

  // *** NEW useEffect TO RELIABLY SAVE RESULTS ***
  useEffect(() => {
    if (testCount === 5) {
      saveTestResults(reactionTimes);
    }
  }, [testCount]); // This effect runs only when testCount changes

  const startTest = () => {
    if (testCount >= 5) return;
    setReactionTime(null);
    setWaiting(true);
    const delay = Math.floor(Math.random() * 3000) + 1000;

    setTimeout(() => {
      setStartTime(Date.now());
      setWaiting(false);
    }, delay);
  };

  // *** SIMPLIFIED handleClick ***
  const handleClick = () => {
    if (waiting) {
      return;
    }

    if (testCount < 5) {
      if (startTime) {
        const endTime = Date.now();
        const newReactionTime = endTime - startTime - 100;
        setReactionTime(newReactionTime);
        setReactionTimes(prevTimes => [...prevTimes, newReactionTime]);
        setTestCount(prevCount => prevCount + 1); // Just update the count
        setStartTime(null);
      } else {
        startTest();
      }
    } else {
      // Logic to restart the test
      setWaiting(false);
      setStartTime(null);
      setReactionTime(null);
      setReactionTimes([]);
      setTestCount(0);
    }
  };

  const getAverageReactionTime = () => {
    if (reactionTimes.length === 0) return 0;
    const sum = reactionTimes.reduce((acc, time) => acc + time, 0);
    return (sum / reactionTimes.length).toFixed(2);
  };

  return (
    <Container sx={{height : '100vh'}}>
      <Header isMobile={isMobile.toString()}>
        <Title isMobile={isMobile.toString()}>Reaction Time Test</Title>
        <Instructions isMobile={isMobile.toString()}>
          When the box changes color , click as quickly as you can. Click anywhere to start.
        </Instructions>
      </Header>

      <TestArea onClick={handleClick} waiting={waiting} isMobile={isMobile.toString()}>
        {reactionTime === null && testCount < 5 ? (
          waiting ? 'Click as soon as it turns violet' : 'Click to start'
        ) : testCount < 5 ? (
          `Your reaction time: ${reactionTime} ms`
        ) : (
          'Test Complete! Click to restart'
        )}
      </TestArea>

      {testCount === 5 && (
        <div>
          <h3 style={{ color: '#7f60d4' }}>Average Reaction Time: {getAverageReactionTime()} ms</h3>
        </div>
      )}

      <InfoSection>
        <InfoBox isMobile={isMobile.toString()}>
          <h4 style={{ color: '#7f60d4' }}>Statistics</h4>
          <p>The average reaction time is around 273ms based on collected data.</p>
        </InfoBox>
        <InfoBox isMobile={isMobile.toString()}>
          <h4 style={{ color: '#7f60d4' }}>About the test</h4>
          <p>
            This test measures your reaction time by having you click as soon as the red box
            turns green. Your reaction time may be affected by your computer's latency.
          </p>
        </InfoBox>
      </InfoSection>
    </Container>
  );
};

export default ReactionTime;
