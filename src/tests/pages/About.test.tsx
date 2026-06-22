/**
 * Unit Tests: About Page
 * Tests element IDs for automation and correct UI content rendering.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import About from '../../pages/About';

const renderAbout = () => render(<About />);

describe('About Page', () => {
  describe('Element IDs and test attributes (for automation)', () => {
    it('renders main container with id="about-container"', () => {
      renderAbout();
      const container = document.getElementById('about-container');
      expect(container).toBeInTheDocument();
      expect(container).toHaveAttribute('data-testid', 'about-container');
    });

    it('renders badge with id="about-badge"', () => {
      renderAbout();
      const badge = document.getElementById('about-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-testid', 'about-badge');
    });

    it('renders title with id="about-title"', () => {
      renderAbout();
      const title = document.getElementById('about-title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveAttribute('data-testid', 'about-title');
    });

    it('renders subtitle with id="about-subtitle"', () => {
      renderAbout();
      const subtitle = document.getElementById('about-subtitle');
      expect(subtitle).toBeInTheDocument();
      expect(subtitle).toHaveAttribute('data-testid', 'about-subtitle');
    });

    it('renders banner with id="about-banner-container"', () => {
      renderAbout();
      const banner = document.getElementById('about-banner-container');
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveAttribute('data-testid', 'about-banner-container');
    });

    it('renders image with id="about-banner-image"', () => {
      renderAbout();
      const image = document.getElementById('about-banner-image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('data-testid', 'about-banner-image');
    });

    it('renders thesis card with id="about-thesis-card"', () => {
      renderAbout();
      const card = document.getElementById('about-thesis-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('data-testid', 'about-thesis-card');
    });

    it('renders amenities container with id="about-amenities-container"', () => {
      renderAbout();
      const amenities = document.getElementById('about-amenities-container');
      expect(amenities).toBeInTheDocument();
      expect(amenities).toHaveAttribute('data-testid', 'about-amenities-container');
    });

    it('renders architecture features container with id="about-architecture-container"', () => {
      renderAbout();
      const arch = document.getElementById('about-architecture-container');
      expect(arch).toBeInTheDocument();
      expect(arch).toHaveAttribute('data-testid', 'about-architecture-container');
    });
  });

  describe('UI Content Verification', () => {
    it('renders main heading text', () => {
      renderAbout();
      expect(screen.getByText('Seamless Coworking Space Booking System')).toBeInTheDocument();
    });

    it('renders thesis focus information', () => {
      renderAbout();
      expect(screen.getByText('Academic Research & Tesis Focus')).toBeInTheDocument();
      expect(screen.getByText(/AI\/Vibe Coding efficacy/i)).toBeInTheDocument();
    });

    it('renders standard amenities description', () => {
      renderAbout();
      expect(screen.getByText('Ultra-Speed Internet')).toBeInTheDocument();
      expect(screen.getByText('Free-Flow Premium Drinks')).toBeInTheDocument();
      expect(screen.getByText('Ergonomic Lounges')).toBeInTheDocument();
    });

    it('renders architecture engine descriptions', () => {
      renderAbout();
      expect(screen.getByText('Conflict Avoidance Engine')).toBeInTheDocument();
      expect(screen.getByText('Secure Server Settlement')).toBeInTheDocument();
      expect(screen.getByText('Automated Test Hooks')).toBeInTheDocument();
    });
  });
});
