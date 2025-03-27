"use client";

import { use } from 'react';
import { ExamScanner } from '@/components/exam/exam-scanner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ScanExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const handleScanComplete = (result: any) => {
    console.log('Scan result:', result);
    // TODO: Implementar lógica para procesar el resultado del escaneo
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/exams/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Escanear Respuestas</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-muted p-4 rounded-lg mb-6">
          <h2 className="font-semibold mb-2">Instrucciones</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Asegúrate de que la hoja de respuestas esté bien iluminada y sin sombras</li>
            <li>Centra el código QR en el recuadro de la cámara</li>
            <li>Mantén la cámara estable hasta que se complete el escaneo</li>
          </ol>
        </div>

        <ExamScanner onScanComplete={handleScanComplete} />
      </div>
    </div>
  );
} 