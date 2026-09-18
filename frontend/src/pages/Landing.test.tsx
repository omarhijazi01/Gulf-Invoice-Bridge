import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Landing } from './Landing';

describe('public landing page', () => {
  it('keeps one hero CTA pair and no duplicate get-started link', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    const hero = screen.getByRole('region', {
      name: 'Invoice Intelligence & ERP Integration for Modern Workflows',
    });
    expect(within(hero).getByRole('link', { name: /Open live demo/i })).toHaveAttribute(
      'href',
      '/app',
    );
    expect(within(hero).getByRole('link', { name: /View GitHub/i })).toHaveAttribute(
      'href',
      'https://github.com/omarhijazi01/Gulf-Invoice-Bridge',
    );
    expect(screen.queryByRole('link', { name: /Get started/i })).not.toBeInTheDocument();
  });

  it('uses the verified local skyline and keeps sign in disabled until auth exists', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    const image = document.querySelector<HTMLImageElement>('.landing-visual img');
    expect(image).toHaveAttribute('src', '/landing-city.jpg');

    const signIn = screen.getByRole('button', { name: 'Sign in' });
    expect(signIn).toBeDisabled();
    expect(signIn).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows all three capability cards', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    expect(screen.getByText('Document intake')).toBeVisible();
    expect(screen.getByText('Extraction & validation')).toBeVisible();
    expect(screen.getByText('ERP-ready integration')).toBeVisible();
  });
});
