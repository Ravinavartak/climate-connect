import React from 'react';
import NavBar from '../components/NavBar';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function Community() {
  const { user } = useContext(AuthContext);
  const greeting = user.displayName || user.email;

  return (
    <>
      <NavBar greeting={greeting} />
      <div className="page-container">
        <h1>Community Forum</h1>
        <p>Connect with other climate enthusiasts here.</p>
        {/* Add your community forum functionality here */}
      </div>
    </>
  );
}