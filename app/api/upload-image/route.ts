// app/api/upload-image/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }
    
    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }
    
    // Create a unique filename
    const uniqueId = Date.now().toString();
    const fileExtension = file.name.split('.').pop();
    const fileName = `image-${uniqueId}.${fileExtension}`;
    
    // Create the file path
    const filePath = path.join(process.cwd(), 'uploads');

    // Create the uploads directory if it doesn't exist
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true });
    }

    // Convert the file to a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write the file to the uploads directory
    const fullPath = path.join(filePath, fileName);
    fs.writeFileSync(fullPath, buffer);

    // Return the path to the uploaded image
    return NextResponse.json({
      success: true,
      imagePath: `/api/images/${fileName}`
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}