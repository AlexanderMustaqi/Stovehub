import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppContent from './AppContent'; 


function App() {
  
  //   sessionStorage.setItem("email", "pn@gmail.com");
  
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
export default App;
