import { Calendar } from '#/components/calendar';
import { ProgressBar } from '#/components/progress-bar';
import { updateGlosarium } from '#/services/glosarium-updater.service';
import { useUpdaterStore } from '#/stores/updater.store';
import { formatDateIdStandard } from '#/utils/date.util';
import { createFileRoute } from '@tanstack/react-router'
import { FileSpreadsheet } from 'lucide-react';
import { useCallback, useEffect, useState  } from 'react';
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner';

export const Route = createFileRoute('/updater')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const {progress: updateProgress, message: updateMessage, isError: isUpdateError, statChanged: updateStatChanged, statTotal: updateStatTotal} = useUpdaterStore()

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pin, setPin] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleFileDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, [])

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date)
    setShowCalendar(false)
  }

  const handleNavigateBack = () => {
    navigate({ to: '/' })
  }

  const {
    getRootProps: getInputFileContainerProps,
    getInputProps: getInputFileProps,
    isDragActive: isInputFileDragActive,
    isDragAccept: isInputFileDragAccept,
    isDragReject: isInputFileDragReject
  } = useDropzone({
    onDrop: handleFileDrop,
    multiple: false,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    disabled: isUpdating
  })

  const getInputFileContainerClass = () => {
    const baseClass = "w-full h-40 flex flex-col items-center justify-center gap-4 border-2 rounded-xl transition-all duration-200 cursor-pointer text-center p-4 ";
    
    if (isInputFileDragReject) return baseClass + "border-red-500 bg-red-50 text-red-600";
    if (isInputFileDragAccept) return baseClass + "border-emerald-500 bg-emerald-50 text-emerald-600";
    if (isInputFileDragActive) return baseClass + "border-emerald-400 bg-emerald-50/50 text-emerald-500";
    if (selectedFile) return baseClass + "border-emerald-600 bg-emerald-50/50"
    
    return baseClass + "border-gray-300 bg-white text-gray-500 hover:border-gray-400";
  };

  const handleUpdateGlosarium = async () => {
    useUpdaterStore.setState({ isError: false, message: '', progress: 0, statChanged: 0, statTotal: 0})
    setShowCalendar(false)

    if (!selectedFile) {
      toast.warning('File Excel tidak boleh kosong', {duration: 3000})
      return
    }
    if (!pin) {
      toast.warning('Pin tidak boleh kosong', {duration: 3000})
      return
    }

    setIsUpdating(true)
    const fileBuffer = await selectedFile.arrayBuffer()
    await updateGlosarium(fileBuffer, pin, selectedDate.toISOString())
    setIsUpdating(false)
  }

  useEffect(() => {
    return () => {
      useUpdaterStore.setState({isError: false, message: '', progress: 0, statChanged: 0, statTotal: 0})
    }
  }, [])

  return (
    <div className="py-6 px-5 space-y-4">
      <button onClick={() => { handleNavigateBack() }} disabled={isUpdating} className="flex items-center justify-center py-1 pl-1 pr-3 text-sm bg-gray-200 rounded-md w-max">
        <span>
          <svg className="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m14 8-4 4 4 4"></path>
          </svg>
        </span>
        Kembali
      </button>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold tracking-wide">
          Pembaruan Glosarium
        </h1>
      </div>
      <div className="w-full p-2 border-t border-gray-400"></div>
      {/* Date Input */}
      <div className='flex flex-col gap-1'>
        <p className='text-sm'>Tanggal Pembaruan: <span className='font-bold'>{formatDateIdStandard(selectedDate)}</span></p>
        <button onClick={() => { setShowCalendar((prev) => !prev) }} disabled={isUpdating} className='text-sm py-1 px-2 rounded-lg bg-gray-200'>ganti tanggal</button>
        <div className='relative'>
          <div 
            className={`absolute transition-all duration-300 ease-out origin-top ${showCalendar ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}
          >
            <Calendar mode='single' selected={selectedDate} onSelect={handleSelectDate} disabled={isUpdating} className='rounded-lg border bg-white' required/>
          </div>
        </div>
      </div>
      {/* File Input */}
      <div className='flex flex-col gap-1'>
        <p className='text-sm'>Pilih File Excel</p>
        <div {...getInputFileContainerProps()} className={getInputFileContainerClass()}>
          <input {...getInputFileProps()} />

          <FileSpreadsheet className='size-8 text-emerald-700' />

          <div className="text-sm font-medium">
            {selectedFile ? (
              <span className="text-emerald-700 font-bold">{selectedFile.name}</span>
            ) : isInputFileDragReject ? (
              "Format file tidak didukung! (Hanya Excel/CSV)"
            ) : (
              "Tarik file atau klik untuk memilih file Excel"
            )}
          </div>
        </div>
      </div>

      {/* Pin input */}
      <div className='flex flex-col gap-1'>
        <p className='text-sm'>Pin</p>
        <input type="password" placeholder="Masukkan Pin..." defaultValue={pin} onChange={(e) => { setPin(e.target.value) }} disabled={isUpdating} className="block w-full p-2 text-sm text-gray-900 bg-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none" />
      </div>

      {updateProgress >= 100 && !isUpdateError && (
        <div className='rounded-lg border-2 border-emerald-400 bg-emerald-100/50 p-4'>
          <p className='text-emerald-800 font-bold'>Glosarium Berhasil Diperbarui</p>
          <p className='text-sm'>Jumlah kata terbaca: <span className='font-bold text-emerald-600'>{updateStatTotal}</span></p>
          <p className='text-sm'>Jumlah kata diperbarui: <span className='font-bold text-emerald-600'>{updateStatChanged}</span></p>
        </div>
      )}

      {isUpdateError && (
        <div className='rounded-lg border-2 border-red-400 bg-red-100/50 p-4'>
          <p className='text-red-800 font-bold'>Glosarium Gagal Diperbarui</p>
          <p className='text-sm'>{updateMessage}</p>
        </div>
      )}

      {isUpdating
        ? (
          <ProgressBar progress={updateProgress} message={updateMessage} />
        )
        : (
          <button
            onClick={() => { handleUpdateGlosarium() }}
            disabled={isUpdating}
            className="flex flex-col items-center justify-center w-full px-4 py-2 text-sm text-white cursor-pointer border border-blue-200 rounded-lg bg-blue-600 hover:bg-blue-700"
          >
            Perbarui Data
          </button>
        )
      }

    </div>
  )
}
