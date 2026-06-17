import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardMoveControls } from '../CardMoveControls';

function setup(props: Partial<Parameters<typeof CardMoveControls>[0]> = {}) {
  const onMoveLeft = vi.fn();
  const onMoveRight = vi.fn();
  render(
    <CardMoveControls
      canMoveLeft={true}
      canMoveRight={true}
      onMoveLeft={onMoveLeft}
      onMoveRight={onMoveRight}
      {...props}
    />,
  );
  return { onMoveLeft, onMoveRight };
}

describe('CardMoveControls', () => {
  it('enables both arrows in a middle column', () => {
    setup();
    expect(screen.getByLabelText('Move to previous column')).not.toBeDisabled();
    expect(screen.getByLabelText('Move to next column')).not.toBeDisabled();
  });

  it('disables left arrow in the first column', () => {
    setup({ canMoveLeft: false });
    expect(screen.getByLabelText('Move to previous column')).toBeDisabled();
    expect(screen.getByLabelText('Move to next column')).not.toBeDisabled();
  });

  it('disables right arrow in the last column', () => {
    setup({ canMoveRight: false });
    expect(screen.getByLabelText('Move to previous column')).not.toBeDisabled();
    expect(screen.getByLabelText('Move to next column')).toBeDisabled();
  });

  it('calls onMoveLeft when left arrow is clicked', async () => {
    const { onMoveLeft } = setup();
    await userEvent.click(screen.getByLabelText('Move to previous column'));
    expect(onMoveLeft).toHaveBeenCalledOnce();
  });

  it('calls onMoveRight when right arrow is clicked', async () => {
    const { onMoveRight } = setup();
    await userEvent.click(screen.getByLabelText('Move to next column'));
    expect(onMoveRight).toHaveBeenCalledOnce();
  });

  it('does not call onMoveLeft when disabled', async () => {
    const { onMoveLeft } = setup({ canMoveLeft: false });
    await userEvent.click(screen.getByLabelText('Move to previous column'));
    expect(onMoveLeft).not.toHaveBeenCalled();
  });
});
