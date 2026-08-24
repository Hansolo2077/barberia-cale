export type WebDateInputProps = {
  value: string;
  label: string;
  onChange: (value: string) => void;
  minimumDate?: string;
  maximumDate?: string;
  disabled?: boolean;
  hasError?: boolean;
  describedBy?: string;
};

export default function WebDateInput(_props: WebDateInputProps) {
  return null;
}
