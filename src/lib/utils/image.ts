export const resizeImage = (file: File, maxDimension = 128, quality = 0.75): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Kon afbeelding niet lezen'));
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context ontbreekt'));

        // Crop to center square first
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const outputSize = Math.min(side, maxDimension);

        canvas.width = outputSize;
        canvas.height = outputSize;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, outputSize, outputSize);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Kon afbeelding niet laden'));
      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
};

export const cropToSquareDataUrl = (dataUrl: string, maxDimension = 128, quality = 0.75): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context ontbreekt'));

      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const outputSize = Math.min(side, maxDimension);

      canvas.width = outputSize;
      canvas.height = outputSize;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, outputSize, outputSize);

      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Kon afbeelding niet laden'));
    img.src = dataUrl;
  });
};
