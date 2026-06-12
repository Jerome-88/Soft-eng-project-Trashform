import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders Trashform app', () => {
  render(<App />);
  const appElement = screen.getByText(/trashform/i);
  expect(appElement).toBeInTheDocument();
});
