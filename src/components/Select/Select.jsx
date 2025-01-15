"use client";
import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Select component with ssr: false to prevent hydration issues
const Select = dynamic(() => import('react-select'), { ssr: false });

const SelectField = ({ isMulti = true, options = [], onChange }) => {
  const [selectedOptions, setSelectedOptions] = useState([]);

  const handleChange = (selected) => {
    // console.log('Selected options:', selected);
    setSelectedOptions(selected);
    if (onChange) onChange(selected);
  };

  return (
    <div style={{ width: '100%' }}>
      <Select
        isMulti={isMulti}
        value={selectedOptions}
        onChange={handleChange}
        options={options}
      />
    </div>
  );
};


export default SelectField;
