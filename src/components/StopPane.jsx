import React from 'react';
import Stop from './Stop';
import Graph from './Graph';
import ArrivalList from './ArrivalList';
import styles from './StopPane.css';

function StopPane() {
  return (
    <div className={styles.stopPane}>
      <Stop/>
      <Graph/>
      <ArrivalList/>
    </div>
  );
}

export default StopPane;

