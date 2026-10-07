import type { FC } from "react";
import { useState } from "react";
import { Button, usePortal } from "@canonical/react-components";
import type { LxdImageType, RemoteImage } from "types/image";
import ImageSelector from "pages/images/ImageSelector";
import ImageReferenceSelector from "pages/images/ImageReferenceSelector";

interface Props {
  onSelect: (image: RemoteImage, type?: LxdImageType) => void;
}

const SelectImageBtn: FC<Props> = ({ onSelect }) => {
  const { openPortal, closePortal, isOpen, Portal } = usePortal();
  const [isUsingImageReference, setUsingImageReference] = useState(false);

  const handleSelect = (image: RemoteImage, type?: LxdImageType) => {
    closePortal();
    setUsingImageReference(false);
    onSelect(image, type);
  };

  const close = () => {
    closePortal();
    setUsingImageReference(false);
  };

  return (
    <>
      <Button
        appearance="positive"
        onClick={openPortal}
        type="button"
        id="select-image"
      >
        <span>Browse images</span>
      </Button>
      {isOpen && (
        <Portal>
          {isUsingImageReference ? (
            <ImageReferenceSelector
              onBack={() => {
                setUsingImageReference(false);
              }}
              onClose={close}
              onSelect={handleSelect}
            />
          ) : (
            <ImageSelector
              onClose={close}
              onSelect={handleSelect}
              onUseImageReference={() => {
                setUsingImageReference(true);
              }}
            />
          )}
        </Portal>
      )}
    </>
  );
};

export default SelectImageBtn;
