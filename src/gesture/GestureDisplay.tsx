
import { GestureType } from '../gesture/gestureDetection';

interface GestureDisplayProps {
  currentGesture: GestureType;
}

export const GestureDisplay = ({ currentGesture }: GestureDisplayProps) => {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-medium mb-2">Current Gesture:</h3>
      <div className={`text-xl font-bold p-3 rounded-lg text-white ${
        currentGesture === 'thumbs_up' ? 'bg-green-500' :
        currentGesture === 'thumbs_down' ? 'bg-red-500' :
        currentGesture === 'flat_hand' ? 'bg-blue-500' :
        'bg-gray-500'
      }`}>
        {currentGesture === 'unknown' ? 'No gesture detected' : 
         currentGesture === 'thumbs_up' ? 'Thumbs Up 👍' :
         currentGesture === 'thumbs_down' ? 'Thumbs Down 👎' :
         currentGesture === 'flat_hand' ? 'Flat Hand ✋' : 
         currentGesture}
      </div>
    </div>
  );
};
