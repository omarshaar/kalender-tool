import React from 'react';
import Calender from './calender/calender';
import { MainProvider } from './context';
import { EventsProvider } from './context/events';

const App = () => {
  return <MainProvider><EventsProvider><Calender /></EventsProvider></MainProvider>;
};

export default App;