"use client";
import { Dispatch, SetStateAction } from "react";

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
  setGdprConsent: Dispatch<SetStateAction<boolean>>;
}

export default function TermsAndPrivacyPolicy({
  gdprConsent,
  setGdprConsent,
}: TermsAndPrivacyPolicyProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <div className="flex items-center justify-between p-2">
        <div className="flex w-full align-center gap-x-3">
          <Checkbox
            name="gdprConsent"
            isSelected={gdprConsent}
            onValueChange={setGdprConsent}
            classNames={{
              base: "p-0 flex items-center",
            }}
          >
            I agree with the{" "}
          </Checkbox>
          <Link className="cursor-pointer" onPress={onOpen}>
            privacy policy
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
