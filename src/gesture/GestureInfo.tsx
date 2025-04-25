
export const GestureInfo = () => {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">About This Demo</h2>
        <p className="mb-4">
          This application uses TensorFlow.js and the HandPose detection model to recognize hand gestures 
          in real-time from your webcam feed. It can detect three different gestures:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-green-100 rounded-lg">
            <h3 className="font-bold text-green-800 mb-2">👍 Thumbs Up</h3>
            <p className="text-green-700">Thumb pointing up with the other fingers curled.</p>
          </div>
          
          <div className="p-4 bg-red-100 rounded-lg">
            <h3 className="font-bold text-red-800 mb-2">👎 Thumbs Down</h3>
            <p className="text-red-700">Thumb pointing down with the other fingers curled.</p>
          </div>
          
          <div className="p-4 bg-blue-100 rounded-lg">
            <h3 className="font-bold text-blue-800 mb-2">✋ Flat Hand</h3>
            <p className="text-blue-700">Palm facing the camera with fingers extended.</p>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm">
          Note: For best results, ensure good lighting and position your hand clearly in the camera view.
          This demo runs entirely in your browser - no data is sent to any server.
        </p>
      </div>
    );
  };
  