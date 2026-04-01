const fs = require('fs');

async function download(url, path) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    // For images we need arrayBuffer, for HTMl text is fine, but buffer handles both
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    fs.writeFileSync(path, buffer);
    console.log(`Saved: ${path}`);
  } catch (error) {
    console.error(`Failed to download ${path}:`, error.message);
  }
}

async function run() {
  const htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzgwYTM4MTFiNWE0MzRjMGNiMjdjZDZiOGRlZWUxYjRlEgsSBxCi6bOrsBMYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTQ0NjUyNjg4OTU5MjkyNTI4OA&filename=&opi=89354086";
  const imgUrl = "https://lh3.googleusercontent.com/aida/ADBb0ui32FnKIzh1O-15AjLjCxNyT__VIOQwKuthNGbjvYAr4kAzPN6BKUs4k8pdlhe5PhcQ7SaR7cVCXeAxIPUEWww644W4kTswR28X3Bu6w5tLhDGrSCkPPVPB2k4dluNavM5zL3sZ4aBKNR2HpziECwoufWE4bpxMnXIFFFPtnzTAkSyHem-sW03l05FR_8wZ9WQYe6uOfNnJDAZ6rEOQs2cwJ5KXI9Sm5US2nKtpUrL2ZvFBDexsqh_7iuqC";

  await download(htmlUrl, 'm:/HelathCareGragudatedProject/frontend/bmi_raw.html');
  await download(imgUrl, 'm:/HelathCareGragudatedProject/frontend/bmi_raw.jpg');
  console.log('DONE');
}

run();
