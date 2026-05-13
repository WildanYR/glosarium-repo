import { apiSafetyPinCheck } from '#/api/glosarium-updater.api';
import { useUpdaterStore } from '#/stores/updater.store';
import { getGlosariumWorker, sqliteSyncDatabase } from '#/workers/glosarium-wrapper.worker';
import { proxy } from 'comlink'
import { toast } from 'sonner';

export async function updateGlosarium(fileBuffer: ArrayBuffer, pin: string, updateDate?: string) {
  const glosariumWorker = getGlosariumWorker()
  if (!glosariumWorker) {
    toast.error('Worker belum diinisiasi', {description: 'Coba refresh/ restart app', duration: 5000})
    return
  }

  try {
    const pinCheck = await apiSafetyPinCheck(pin)
    if (pinCheck.status === 'error') {
      toast.error('Pin tidak cocok', {duration: 3000})
      useUpdaterStore.setState({progress: 0, message: 'Pin tidak cocok', isError: true, statTotal: 0, statChanged: 0})
      return
    }

    const progressCheck = proxy((message: string, progress: number) => {
      useUpdaterStore.setState({ message, progress, isError: false, statTotal: 0, statChanged:0 })
    });
    const updateResult = await glosariumWorker.updateGlosariumWithExcel(window.location.origin, fileBuffer, pin, progressCheck, updateDate)

    useUpdaterStore.setState({isError: false, progress: 100, message: updateResult.message, statTotal: updateResult.stats.total, statChanged: updateResult.stats.changed})
    toast.success('Glosarium berhasil diperbaruhi!', {duration: 3000})
    sqliteSyncDatabase()
  } catch(error) {
    useUpdaterStore.setState({progress: 0, message: (error as Error).message, isError: true, statTotal: 0, statChanged: 0})
    toast.error('Gagal memperbaruhi Glosarium', {duration: 3000})
  }
}