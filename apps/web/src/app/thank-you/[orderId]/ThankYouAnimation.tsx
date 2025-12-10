'use client';

import React from 'react';
import styles from './ThankYouAnimation.module.css';

export default function ThankYouAnimation() {
  return (
    <div className={styles.outer}>
      <div className={styles.heartWrapper}>
        <div className={styles.glow} />
        <svg
          className={styles.heartSvg}
          viewBox="0 0 200 200"
          aria-hidden="true"
        >
          <defs>
            <radialGradient
              id="ty-heart-gradient"
              cx="50%"
              cy="30%"
              r="70%"
            >
              <stop offset="0%" stopColor="#fecaca" />
              <stop offset="30%" stopColor="#fb7185" />
              <stop offset="65%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </radialGradient>
          </defs>

          <path
            className={styles.heartCore}
            d="M100 30 C 70 0, 0 25, 0 80 C 0 130, 50 170, 100 200 C 150 170, 200 130, 200 80 C 200 25, 130 0, 100 30 Z"
            fill="url(#ty-heart-gradient)"
          />
        </svg>
      </div>
    </div>
  );
}
