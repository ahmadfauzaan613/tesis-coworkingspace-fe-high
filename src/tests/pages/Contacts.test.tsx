/**
 * Unit Tests: Contacts Page
 * Tests form elements, IDs for automation, input states, and messaging submission.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { faker } from '@faker-js/faker';
import { MemoryRouter } from 'react-router-dom';
import Contacts from '../../pages/Contacts';

const renderContacts = () =>
  render(
    <MemoryRouter>
      <Contacts />
    </MemoryRouter>
  );

describe('Contacts Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering & Element IDs (for automation)', () => {
    it('renders the contact form with id="contact-form"', () => {
      renderContacts();
      expect(document.getElementById('contact-form')).toBeInTheDocument();
    });

    it('renders name input with id="contact-name"', () => {
      renderContacts();
      expect(document.getElementById('contact-name')).toBeInTheDocument();
    });

    it('renders email input with id="contact-email"', () => {
      renderContacts();
      expect(document.getElementById('contact-email')).toBeInTheDocument();
    });

    it('renders message textarea with id="contact-message"', () => {
      renderContacts();
      expect(document.getElementById('contact-message')).toBeInTheDocument();
    });

    it('renders send button with id="btn-send-message"', () => {
      renderContacts();
      expect(document.getElementById('btn-send-message')).toBeInTheDocument();
    });
  });

  describe('UI Content Rendering', () => {
    it('renders header text and contact details', () => {
      renderContacts();
      expect(screen.getByText('Get in Touch')).toBeInTheDocument();
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
      expect(screen.getByText('support@spacebook.com')).toBeInTheDocument();
      expect(screen.getByText('+62 (21) 555-8930')).toBeInTheDocument();
      expect(screen.getByText(/Sudirman Central Business District/i)).toBeInTheDocument();
    });
  });

  describe('Form Interactions & Submission', () => {
    it('updates name, email, and message inputs when user types', async () => {
      renderContacts();
      const name = faker.person.fullName();
      const email = faker.internet.email();
      const message = faker.lorem.sentence();

      const nameInput = document.getElementById('contact-name') as HTMLInputElement;
      const emailInput = document.getElementById('contact-email') as HTMLInputElement;
      const messageInput = document.getElementById('contact-message') as HTMLTextAreaElement;

      await userEvent.type(nameInput, name);
      await userEvent.type(emailInput, email);
      await userEvent.type(messageInput, message);

      expect(nameInput.value).toBe(name);
      expect(emailInput.value).toBe(email);
      expect(messageInput.value).toBe(message);
    });

    it('shows success message and resets inputs after submitting the form', async () => {
      renderContacts();
      const nameInput = document.getElementById('contact-name') as HTMLInputElement;
      const emailInput = document.getElementById('contact-email') as HTMLInputElement;
      const messageInput = document.getElementById('contact-message') as HTMLTextAreaElement;
      const submitBtn = document.getElementById('btn-send-message') as HTMLButtonElement;

      await userEvent.type(nameInput, faker.person.fullName());
      await userEvent.type(emailInput, faker.internet.email());
      await userEvent.type(messageInput, faker.lorem.sentence());

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Message Sent Successfully!')).toBeInTheDocument();
      });

      // Form inputs should be cleared on success
      expect(document.getElementById('contact-form')).not.toBeInTheDocument();
    });
  });
});
