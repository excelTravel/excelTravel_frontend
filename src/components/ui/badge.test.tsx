import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusPill } from './badge';

describe('StatusPill', () => {
  it('renders the status text with underscores turned into spaces by default', () => {
    render(<StatusPill status="in_transit" />);
    expect(screen.getByText('in transit')).toBeInTheDocument();
  });

  it('renders custom children instead of the raw status when provided', () => {
    render(<StatusPill status="paid">Paid in full</StatusPill>);
    expect(screen.getByText('Paid in full')).toBeInTheDocument();
    expect(screen.queryByText('paid')).not.toBeInTheDocument();
  });

  it('falls back to the neutral tone for an unrecognized status instead of throwing', () => {
    render(<StatusPill status="totally_unknown_status" />);
    expect(screen.getByText('totally unknown status')).toBeInTheDocument();
  });
});
