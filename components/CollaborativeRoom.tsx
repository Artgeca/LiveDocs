'use client';

import { ClientSideSuspense, RoomProvider } from '@liveblocks/react/suspense';
import { Editor } from '@/components/editor/Editor';
import Header from '@/components/Header';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Input } from './ui/input';
import { currentUser } from '@clerk/nextjs/server';
import Image from 'next/image';
import { updateDocument } from '@/lib/actions/room.actions';
import Loader from './Loader';

const CollaborativeRoom = ({ roomId, roomMetadata }: CollaborativeRoomProps) => {
  const currentUserType = 'editor';

  const [documentTitle, setDocumentTitle] = useState(roomMetadata.title);
  const [editting, setEditting] = useState(false);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  const updateTitleHandler = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setLoading(true);

      try {
        if (documentTitle !== roomMetadata.title) {
          const updatedDocument = await updateDocument(roomId, documentTitle);
        }
      } catch (error) {
        console.error(error);
      }

      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setEditting(false);
        updateDocument(roomId, documentTitle);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [roomId, documentTitle]);

  useEffect(() => {
    if (editting && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editting]);


  return (
    <RoomProvider id={roomId}>
      <ClientSideSuspense fallback={<Loader />}>
        <div className="collaborative-room">
          <Header>
            <div ref={containerRef} className="flex items-center justify-center gap-2 w-fit">
              {editting && !loading ? (
                <Input
                  type='text'
                  value={documentTitle}
                  ref={inputRef}
                  placeholder='Enter title'
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  onKeyDown={updateTitleHandler}
                  disabled={!editting}
                  className='document-title-input'
                />
              ) : (
                <>
                  <p className='document-title'>{documentTitle}</p></>
              )}

              {currentUserType === 'editor' && !editting && (
                <Image
                  src='/assets/icons/edit.svg'
                  alt='edit'
                  width={24}
                  height={24}
                  onClick={() => setEditting(true)}
                  className='pointer'
                />
              )}

              {currentUserType !== 'editor' && !editting && (
                <p className='view-only-tag'>View only</p>
              )}

              {loading && <p className='text-sm text-gray-400'>Saving...</p>}
            </div>
            <div className="flex justify-end flex-1 w-full gap-2 sm:gap-3">
              <SignedOut>
                <SignInButton />
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </Header>
          <Editor />
        </div>
      </ClientSideSuspense>
    </RoomProvider>
  );
};

export default CollaborativeRoom;
