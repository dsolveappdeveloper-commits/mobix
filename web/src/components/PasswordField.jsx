import { useState } from 'react';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// Normal TextField maari dhaan, extra ah show / hide eye icon
export default function PasswordField({ slotProps, ...props }) {
  const [show, setShow] = useState(false);

  return (
    <TextField
      {...props}
      type={show ? 'text' : 'password'}
      slotProps={{
        ...slotProps,
        input: {
          ...slotProps?.input,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                onClick={() => setShow((s) => !s)}
                aria-label="toggle password visibility"
              >
                {show ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}