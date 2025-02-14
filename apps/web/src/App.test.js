import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Quick Relay header', () => {
  render(<App />);
  const headerElement = screen.getByText(/Quick Relay/i);
  expect(headerElement).toBeInTheDocument();
});