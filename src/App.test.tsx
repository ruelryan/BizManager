import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the main app component', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /manage your business with confidence/i })).toBeInTheDocument();
  });
});
