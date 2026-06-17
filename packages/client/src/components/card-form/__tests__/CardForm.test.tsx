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
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a validation error when title is empty', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Title is required')).toBeInTheDocument();
  });

  it('calls onSubmit with trimmed values when title is provided', async () => {
    const { onSubmit } = setup();
    await userEvent.type(screen.getByPlaceholderText('Card title'), '  Fix login bug  ');
    await userEvent.type(screen.getByPlaceholderText('What needs to be done?'), 'Fails on Safari');
    await userEvent.type(screen.getByPlaceholderText("Who's on it?"), 'Oded');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Fix login bug',
      description: 'Fails on Safari',
      assignee: 'Oded',
    });
  });

  it('pre-fills fields from initialValues', () => {
    setup({ title: 'Existing', description: 'Desc', assignee: 'Alice' });
    expect(screen.getByPlaceholderText('Card title')).toHaveValue('Existing');
    expect(screen.getByPlaceholderText('What needs to be done?')).toHaveValue('Desc');
    expect(screen.getByPlaceholderText("Who's on it?")).toHaveValue('Alice');
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const { onCancel } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
