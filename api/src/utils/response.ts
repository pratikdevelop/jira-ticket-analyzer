export const success = (
  res: any,
  data: any,
  message = "Success"
) => {
  return res.status(200).json({
    success: true,
    message,
    data,
  });
};

export const created = (
  res: any,
  data: any,
  message = "Created successfully"
) => {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
};

export const failure = (
  res: any,
  status: number,
  message: string
) => {
  return res.status(status).json({
    success: false,
    error: message,
  });
};