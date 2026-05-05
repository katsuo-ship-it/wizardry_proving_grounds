import "./Logo.css";

const LOGO_ASCII = `+==========================================+
|                                          |
|         W   I   Z   A   R   D   R   Y    |
|                                          |
+==========================================+`;

export function Logo() {
  return <pre className="apple2-logo">{LOGO_ASCII}</pre>;
}
