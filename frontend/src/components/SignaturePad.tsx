import { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';

const SignaturePad = forwardRef<any, { label?: string }>(({ label = 'Firma' }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const drawing = useRef(false);
  const [captured, setCaptured] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const start = (e: any) => {
    drawing.current = true;
    const { x, y } = pos(e);
    canvasRef.current!.getContext('2d')!.beginPath();
    canvasRef.current!.getContext('2d')!.moveTo(x, y);
  };
  const move = (e: any) => {
    if (!drawing.current) return;
    e.preventDefault();
    const { x, y } = pos(e);
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const stop = () => { drawing.current = false; };
  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setCaptured(false);
  };

  const capturePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        setCaptured(true);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  useImperativeHandle(ref, () => ({
    getBase64: () => canvasRef.current!.toDataURL('image/png'),
    toDataURL: () => canvasRef.current!.toDataURL('image/png'),
    clear,
  }));

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={300}
        height={150}
        style={{ width: '100%', maxWidth: 300, border: '2px solid #0b63c8', borderRadius: 8, background: '#fff', touchAction: 'none' }}
        onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={start} onTouchMove={move} onTouchEnd={stop}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button type="button" onClick={clear}>Limpiar {label}</button>
        <button type="button" onClick={() => fileRef.current?.click()} style={{ background: '#1a9f5c', color: '#fff' }}>
          {captured ? 'Cambiar foto' : 'Capturar con cámara'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={capturePhoto} style={{ display: 'none' }} />
      </div>
    </div>
  );
});

export default SignaturePad;