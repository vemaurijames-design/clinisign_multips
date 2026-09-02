import { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';

const SignaturePad = forwardRef<any, { label?: string }>(({ label = 'Firma' }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

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
      <div><button type="button" onClick={clear}>Limpiar {label}</button></div>
    </div>
  );
});

export default SignaturePad;
