import React from 'react';
import NavBar from '../components/NavBar';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function News() {
  const { user } = useContext(AuthContext);
  const greeting = user.displayName || user.email;

  return (
    <>
      <NavBar greeting={greeting} />
      <div className="page-container">
        <h1>Climate News Feed</h1>
        <p>Stay updated with the latest climate news and sentiment analysis.</p>
        {/* Add your news feed functionality here */}
      </div>
    </>
  );
}