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
    expect(screen.getByTestId('move-left')).not.toBeDisabled();
    expect(screen.getByTestId('move-right')).not.toBeDisabled();
  });

  it('disables left arrow in the first column', () => {
    setup({ canMoveLeft: false });
    expect(screen.getByTestId('move-left')).toBeDisabled();
    expect(screen.getByTestId('move-right')).not.toBeDisabled();
  });

  it('disables right arrow in the last column', () => {
    setup({ canMoveRight: false });
    expect(screen.getByTestId('move-left')).not.toBeDisabled();
    expect(screen.getByTestId('move-right')).toBeDisabled();
  });

  it('calls onMoveLeft when left arrow is clicked', async () => {
    const { onMoveLeft } = setup();
    await userEvent.click(screen.getByTestId('move-left'));
    expect(onMoveLeft).toHaveBeenCalledOnce();
  });

  it('calls onMoveRight when right arrow is clicked', async () => {
    const { onMoveRight } = setup();
    await userEvent.click(screen.getByTestId('move-right'));
    expect(onMoveRight).toHaveBeenCalledOnce();
  });

  it('does not call onMoveLeft when disabled', async () => {
    const { onMoveLeft } = setup({ canMoveLeft: false });
    await userEvent.click(screen.getByTestId('move-left'));
    expect(onMoveLeft).not.toHaveBeenCalled();
  });
});
