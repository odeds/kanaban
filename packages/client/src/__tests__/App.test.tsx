import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders the board heading', async () => {
    render(<App />);
    expect(await screen.findByText('Kanban Board')).toBeInTheDocument();
  });

  it('renders all three columns', async () => {
    render(<App />);
    expect(await screen.findByText('To Do')).toBeInTheDocument();
    expect(await screen.findByText('In Progress')).toBeInTheDocument();
    expect(await screen.findByText('Done')).toBeInTheDocument();
  });
});
