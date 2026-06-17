import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardForm } from '../CardForm';

function setup(initialValues?: Parameters<typeof CardForm>[0]['initialValues']) {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();
  render(<CardForm onSubmit={onSubmit} onCancel={onCancel} initialValues={initialValues} />);
  return { onSubmit, onCancel };
}

describe('CardForm', () => {
  it('does not call onSubmit when title is empty', async () => {
    const { onSubmit } = setup();
    await userEvent.click(screen.getByTestId('form-submit'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a validation error when title is empty', async () => {
    setup();
    await userEvent.click(screen.getByTestId('form-submit'));
    expect(screen.getByTestId('title-error')).toBeInTheDocument();
  });

  it('calls onSubmit with trimmed values when title is provided', async () => {
    const { onSubmit } = setup();
    await userEvent.type(screen.getByTestId('input-title'), '  Fix login bug  ');
    await userEvent.type(screen.getByTestId('input-description'), 'Fails on Safari');
    await userEvent.type(screen.getByTestId('input-assignee'), 'Oded');
    await userEvent.click(screen.getByTestId('form-submit'));
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Fix login bug',
      description: 'Fails on Safari',
      assignee: 'Oded',
    });
  });

  it('pre-fills fields from initialValues', () => {
    setup({ title: 'Existing', description: 'Desc', assignee: 'Alice' });
    expect(screen.getByTestId('input-title')).toHaveValue('Existing');
    expect(screen.getByTestId('input-description')).toHaveValue('Desc');
    expect(screen.getByTestId('input-assignee')).toHaveValue('Alice');
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const { onCancel } = setup();
    await userEvent.click(screen.getByTestId('form-cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
