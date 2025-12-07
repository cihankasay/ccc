import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.jsx';
import './index.css';

function Root() {
  const [token, setToken] = React.useState(localStorage.getItem("token") || null);
  const [user, setUser] = React.useState(
    JSON.parse(localStorage.getItem("user") || "{}")
  );

  return (
    <BrowserRouter>
      <App
        token={token}
        user={user}
        setToken={setToken}
        setUser={setUser}
      />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
