import cn from 'clsx'

interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={cn("_flex _space-x-1 _items-center", className)}>
      {[0, 0.2, 0.4].map((delay, i) => (
        <div
          key={i}
          className="_h-1.5 _w-1.5 _rounded-full _bg-blue-500"
          style={{
            animation: `opacity 1s ease-in-out ${delay}s infinite`
          }}
        />
      ))}
      <style jsx>{`
        @keyframes opacity {
          0% { opacity: 0; }
          40% { opacity: 1; }
          80%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
} 