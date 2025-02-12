"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Checkbox } from "@heroui/checkbox";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import PrivacyPolicyContent from "@/components/common/privacy-policy-content";

interface TermsAndPrivacyPolicyProps {
  gdprConsent: boolean;
  setGdprConsent: (value: boolean) => void;
}

export default function TermsAndPrivacyPolicy({
  gdprConsent,
  setGdprConsent,
}: TermsAndPrivacyPolicyProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <div className="flex items-start px-1 py-2 flex-col gap-y-2">
        <div className="flex justify-start items-center gap-x-1">
          <Checkbox
            name="gdprConsent"
            size="sm"
            checked={gdprConsent}
            onValueChange={setGdprConsent}
          >
            <div className="flex text-sm justify-start gap-x-1">
              To continue please accept our{" "}
            </div>
          </Checkbox>
          <Link className="cursor-pointer" onPress={onOpen} size="sm">
            Privacy policy
          </Link>
        </div>
      </div>
      <Modal
        size="2xl"
        backdrop="blur"
        isOpen={isOpen}
        onClose={onClose}
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Privacy Policy</ModalHeader>
              <ModalBody className="block gap-0">
                <PrivacyPolicyContent />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
