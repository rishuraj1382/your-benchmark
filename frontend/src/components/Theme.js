import { createTheme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';

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

// Note: For best results, use the useMediaQuery hook within your components for responsiveness
// instead of these style objects.
const infoSectionStyles = {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  flexWrap: 'wrap',
  marginTop: '50px',
  padding: '0',
  gap: '40px',
};

const infoBoxStyles = {
  display: 'block',
  minWidth: '375px',
  minHeight: '400px',
  width: '45%',
  padding: '20px',
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  margin: '20px',
  textAlign: 'left',
  transition: 'transform 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  maxWidth: '375px',
  '&:hover': {
    transform: 'scale(1.05)',
  },
};

const gameButtonStyles = {
  margin: theme.spacing(1),
  padding: theme.spacing(1, 4),
  borderRadius: 25,
  fontWeight: 'bold',
  transition: 'all 0.3s',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(127, 96, 212, 0.2)',
  },
};

const wordDisplayStyles = {
  fontWeight: 'bold',
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(3),
};

const scoreDisplayStyles = {
  fontWeight: 'bold',
  color: theme.palette.secondary.main,
};

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  border: '1px solid',
  borderColor: theme.palette.divider,
  borderRadius: '8px',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(127, 96, 212, 0.2)',
  },
}));

export {
  theme,
  infoSectionStyles,
  infoBoxStyles,
  gameButtonStyles,
  wordDisplayStyles,
  scoreDisplayStyles,
  StyledPaper,
};