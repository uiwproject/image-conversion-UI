import React, { useState } from 'react';
import styles from './SelectComponent.module.css';

const SelectComponent = ({ handleChange, selectedQuality}) => {
  

  return (
    <div className={styles.selectContainer}>
      <div className={styles.selectWrapper}>
        <select
          id="slct"
          value={selectedQuality}
          onChange={handleChange}
          className={styles.qualitySelect}
        >
          <option value="" disabled>Select Quality</option>
          <option value="512">Low Quality</option>
          <option value="1080">Medium Quality</option>
          <option value="1980">High Quality</option>
        </select>
        <svg className={styles.arrow} viewBox="0 0 10 6">
          <polyline points="1 1 5 5 9 1" />
        </svg>
      </div>
    </div>
  );
};

export default SelectComponent;
