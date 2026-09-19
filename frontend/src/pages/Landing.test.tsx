import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Landing } from './Landing';
afterEach(cleanup);
describe('landing entry points', () => {
  it('offers one demo entry and the actual repository, with unavailable authentication disabled', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole('link', { name: 'Open live demo' })).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Open live demo' })).toHaveAttribute('href', '/app');
    expect(screen.getByRole('link', { name: 'View GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/omarhijazi01/Gulf-Invoice-Bridge',
    );
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
    expect(screen.queryByRole('link', { name: 'Get started' })).not.toBeInTheDocument();
  });
  it('connects section links and preserves the existing integrations route', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );
    for (const [name, hash] of [
      ['Features', '#features'],
      ['About', '#about'],
    ]) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', hash);
      expect(document.querySelector(hash)).not.toBeNull();
    }
    expect(screen.getByRole('link', { name: 'Integrations' })).toHaveAttribute(
      'href',
      '/integrations',
    );
  });
});
