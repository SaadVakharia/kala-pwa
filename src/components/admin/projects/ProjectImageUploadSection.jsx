import { ImagePlus, X } from 'lucide-react'

export function ProjectImageUploadSection({ imagePreview, onClearImage, onFileInputClick, fileInputRef, onImageChange }) {
  return (
    <div className="flex justify-center mb-2">
      <div className="w-[200px] h-[200px] sm:w-[240px] sm:h-[240px]">
        {imagePreview ? (
          <div className="relative rounded-[2rem] overflow-hidden w-full h-full bg-gray-100 border-4 border-white shadow-xl">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={onClearImage}
              className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors backdrop-blur-md"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onFileInputClick}
            className="w-full h-full rounded-[2rem] border-2 border-dashed border-gray-300 bg-white hover:bg-gray-50 hover:border-kala-red/40 transition-all flex flex-col items-center justify-center gap-3 shadow-sm"
          >
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
              <ImagePlus size={28} className="text-gray-400" />
            </div>
            <div className="text-center px-4">
              <span className="block text-sm font-bold text-gray-700">Upload Project Image</span>
              <span className="block text-xs text-gray-400 mt-1">JPG, PNG</span>
            </div>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onImageChange}
        />
      </div>
    </div>
  )
}
