"use client";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";

export default function ProfileHero() {
  const user = {
    name: "Pratik Raut",
    email: "pratik@gmail.com",
    joined: "July 2026",
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid #E5E7EB",
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          spacing={3}
          alignItems="center"
        >
          <Avatar
            sx={{
              width: 90,
              height: 90,
              fontSize: 36,
            }}
          >
            {user.name.charAt(0)}
          </Avatar>

          <Box flex={1}>
            <Typography
              variant="h5"
              fontWeight={700}
            >
              {user.name}
            </Typography>

            <Typography color="text.secondary">
              {user.email}
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              mt={2}
            >
              <Chip
                label="Member"
                color="primary"
              />

              <Chip
                label={`Joined ${user.joined}`}
                variant="outlined"
              />
            </Stack>
          </Box>

          <Button
            startIcon={<EditIcon />}
            variant="contained"
          >
            Edit Profile
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
