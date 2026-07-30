export function LoadingState() { return <p role="status">Loading data…</p> }
export function ErrorState({ message }: { message: string }) { return <p role="alert">{message}</p> }
