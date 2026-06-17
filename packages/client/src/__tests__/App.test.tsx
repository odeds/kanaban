import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders the board heading', () => {
    render(<App />);
    expect(screen.getByText('Kanban Board')).toBeInTheDocument();
  });

  it('renders all three columns', () => {
    render(<App />);
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });
});
