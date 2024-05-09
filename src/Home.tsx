import React, { useEffect, useState } from 'react';
import { Box, Table, Thead, Tbody, Tr, Th, Td, Button, Text, Icon, Flex, Heading, Image, Menu, MenuButton, MenuList, MenuItem, Divider } from '@chakra-ui/react';
import { supabase, storeTokens, createSocketForDriveWebhookChangesFromDB } from './utils/supabase_client';
import { v4 as uuidv4 } from 'uuid';
import { MdOutlineFolder, MdOutlineInsertDriveFile, MdChevronRight } from 'react-icons/md';
import { FcGoogle } from 'react-icons/fc';
import { profile } from 'console';
// import { initializeGoogleClient, getDriveClient } from './utils/google_drive_client';

interface GoogleDriveFile {
    id: string;
    name: string;
    size: string;
    modifiedTime: string;
    mimeType: string;
    parents: string[];
}

interface PathElement {
    name: string;
    id: string;
}



const Home = () => {
    const [files, setFiles] = useState<GoogleDriveFile[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<GoogleDriveFile[]>([]);
    const [currentPath, setCurrentPath] = useState<PathElement[]>([]);
    // const [currentFolderId, setCurrentFolderId] = useState<string>('root');
    const [channelId, setChannelId] = useState<string>('');
    const [resourceId, setResourceId] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [profilePic, setProfilePic] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [changesProcessedIndex, setChangesProcessedIndex] = useState<number>(0);
    const currentPathRef = React.useRef(currentPath);

    const registerDriveWebhookAPI = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            // console.log(session);
            setName(session.user.user_metadata.full_name);
            // console.log(session.user.user_metadata.avatar_url);
            setProfilePic(session.user.user_metadata.avatar_url);
            let channelId = localStorage.getItem('channelId');
            if (channelId) {
                setChannelId(channelId);
                console.log(channelId, "channelId existing");
                return;
            };
            if (!channelId) {
                channelId = `webhook-channel-${session?.user?.email?.replace(/[^A-Za-z0-9\-_\/=+]/g, '')}-${Date.now()}`;
                console.log('new channel created', channelId);
                localStorage.setItem('channelId', channelId); // Store channelId in local storage
                setChannelId(channelId);

            }

            const accessToken: any = session.provider_token;

            const userId = session.user.id;
            //   await storeTokens(accessToken, session.refresh_token, userId);
            const tokenUrl = 'https://www.googleapis.com/drive/v3/changes/startPageToken';
            const webhookUrl = 'https://sfagl7ugp5.execute-api.ap-south-1.amazonaws.com/webhook';
            //   const driveApiUrl = 'https://www.googleapis.com/drive/v3/changes/watch';

            // Fetch the startPageToken
            const tokenResponse = await fetch(tokenUrl, {
                headers: new Headers({
                    'Authorization': `Bearer ${accessToken}`
                })
            });

            if (!tokenResponse.ok) {
                console.error('Failed to fetch startPageToken:', await tokenResponse.text());
                return;
            }

            const tokenData = await tokenResponse.json();
            const startPageToken = tokenData.startPageToken;
            const driveApiUrl = `https://www.googleapis.com/drive/v3/changes/watch?pageToken=${startPageToken}`;

            //   const resourceId = `resource-${session.user.email}-${Date.now()}`;

            const requestBody = {
                id: channelId, // Unique identifier for this channel
                type: 'web_hook',
                address: webhookUrl,
                payload: true,
                token: uuidv4(), // Verify the request origin
                expiration: (new Date().getTime() + (3600 * 1000 * 24 * 7)).toString(), // 1 week from now
                pageToken: startPageToken
            };

            const response: any = await fetch(driveApiUrl, {
                method: 'POST',
                headers: new Headers({
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                // console.error('Failed to register webhook:', await response.text());
            } else {
                console.log(response, "response");
                setResourceId(response?.resourceId);
                console.log('Webhook registered successfully');
            }
        }

    };


    const fetchFiles = async (folderId: string = 'root') => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const accessToken = session.provider_token;
                const url = new URL('https://www.googleapis.com/drive/v3/files');
                // Exclude trashed files from the query
                url.searchParams.append('q', `'${folderId}' in parents and trashed = false`);
                url.searchParams.append('fields', 'nextPageToken, files(id, name, size, modifiedTime, mimeType, parents)');
                url.searchParams.append('includeItemsFromAllDrives', 'true');
                url.searchParams.append('supportsAllDrives', 'true');
                url.searchParams.append('corpora', 'allDrives'); // Include files from all drives, not just the current user's drive
                const response = await fetch(url.toString(), {
                    headers: new Headers({
                        'Authorization': `Bearer ${accessToken}`
                    })
                });
                const data = await response.json();
                setFiles(data.files);
                // setCurrentPath([{name: "root", id: "root"}]);
                // setCurrentFolderId(folderId);
            }
        } catch (error) {
            console.error('Error fetching files:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRootFolderId = async (accessToken: any) => {
        const url = 'https://www.googleapis.com/drive/v3/files/root';
        const response = await fetch(url, {
            headers: new Headers({
                'Authorization': `Bearer ${accessToken}`
            })
        });
        const data = await response.json();
        return data.id; // This will be the actual ID of the root folder
    };

    const handleInserts = async (payload: any, path: PathElement[]) => {
        console.log('Change received!', payload.new.channel_id, payload);
        // let currentChannelId = localStorage.getItem('channelId');
        // if (payload.new.channel_id == currentChannelId) {
        //     console.log('Channel ID matches. Processing the payload.');

        // } else {
        //     console.log('Channel ID does not match. Ignoring the payload.');
        //     return;
        // }
        if (payload.new) {
            // const pageToken = payload.new.resource_id; // Assuming resource_id is used as pageToken
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.provider_token; // Dynamically fetch from Supabase auth session
            // const url = `https://www.googleapis.com/drive/v3/changes?alt=json&pageToken=${pageToken}`;
            const headers = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            };

            fetch(payload.new.resource_uri, { headers })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        console.error(`Error fetching changes: ${response.status}, ${response.statusText}`);
                        return null;
                    }
                })
                .then(async (data: any) => {
                    console.log(data, "new changes");

                    console.log(path, "path in handleinserts");
                    let currentFolderId = path.length == 0 ? await fetchRootFolderId(accessToken) : path[path.length - 1].id;
                    console.log(path, "currentPath", currentFolderId, "currentFolderId");

                    if (!data.changes && data.changes.length ==  0) {
                        return;
                    }

                    const changedFiles = data.changes.filter((change: any) => 
                        change.file && change.file.id
                    );
                    const removedFiles = data.changes.filter((change: any) => 
                        change.removed && change.file
                    );

                    console.log(changedFiles, removedFiles);
                    // Handle updated or added files
                    if (changedFiles.length > 0) {
                        changedFiles.forEach((change: any) => {
                            const fileId = change.file.id;
                            const url = new URL(`https://www.googleapis.com/drive/v3/files/${fileId}`);
                            url.searchParams.append('fields', 'id, name, size, modifiedTime, mimeType, parents');
                    
                            fetch(url.toString(), {
                                headers: new Headers({
                                    'Authorization': `Bearer ${accessToken}`
                                })
                            })
                            .then(response => response.json())
                            .then(updatedFile => {
                                console.log(updatedFile, 'updatedFile');
                                console.log(currentFolderId, updatedFile.parents);

                                if (updatedFile.parents && updatedFile.parents.includes(currentFolderId)) {
                                    setFiles(prevFiles => {
                                        const fileIndex = prevFiles.findIndex(file => file.id === updatedFile.id);
                                        if (fileIndex !== -1) {
                                            // Update existing file
                                            return prevFiles.map(file => file.id === updatedFile.id ? { ...file, ...updatedFile } : file);
                                        } else {
                                            // Add new file
                                            return [...prevFiles, updatedFile];
                                        }
                                    });
                                } else {
                                    console.log("Updated file is not in the current folder view.");
                                }
                            })
                            .catch(error => console.error('Error updating file info:', error));
                        });
                    }

                                            // Handle removed files
                        if (removedFiles.length > 0) {
                            setFiles(prevFiles => {
                                return prevFiles.filter(file => !removedFiles.some((removedFile: any) => removedFile.file && removedFile.file.id === file.id));
                            });
                        }
                    // Update the index for processed changes
                    setChangesProcessedIndex(data.changes.length);

                    // if (data) {
                    //     const newStartPageToken = data.newStartPageToken;
                })
                .catch(error => {
                    console.error('Error in fetching changes:', error);
                });
        }
    }

    useEffect(() => {
        // This effect could be used to handle changes that need to be made when the path changes,
        // such as fetching new files or updating UI elements.
        console.log(currentPath, "currentPath in useEffect");

        currentPathRef.current = currentPath;
        fetchFiles(currentPath[currentPath.length - 1]?.id || 'root');
    }, [currentPath]); 

    useEffect(() => {
        fetchFiles();
        registerDriveWebhookAPI();
        createSocketForDriveWebhookChangesFromDB((payload: any) => handleInserts(payload, currentPathRef.current));

        return () => {
            // unsubscribe(); // Assuming createSocketForDriveWebhookChangesFromDB returns a function to terminate the connection
            // This function is called on component unmount
            if (channelId && resourceId) {
                stopWebhookChannel(channelId, resourceId);
            }
        };
    }, []);

    const stopWebhookChannel = async (channelId: string, resourceId: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.provider_token;
        const stopChannelUrl = 'https://www.googleapis.com/drive/v3/channels/stop';

        const requestBody = {
            id: channelId,
            resourceId: resourceId,
        };

        const response = await fetch(stopChannelUrl, {
            method: 'POST',
            headers: new Headers({
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            console.error('Failed to stop webhook channel:', await response.text());
        } else {
            console.log('Webhook channel stopped successfully');
        }
    };

    const handleEntryClick = async (file: GoogleDriveFile) => {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
            handleFolderClick(file);
            return;
        }

        window.open(`https://drive.google.com/file/d/${file.id}/view`, '_blank');
    }

    const handleFolderClick = async (file: GoogleDriveFile) => {
        // console.log(file);
        setCurrentPath([...currentPath, { name: file.name, id: file.id }]);
        // await fetchFiles(file.id);
    };

    const handleFileSelect = (file: GoogleDriveFile) => {
        // console.log(file);
        setSelectedFiles([...selectedFiles, file]);
    };

    const handleUpload = async () => {
        console.log('Selected files for upload:', selectedFiles);
    };

    const handlePathClick = async (index: number) => {
        // console.log(index);
        if (index === -1) {
            setCurrentPath([]);
            // await fetchFiles('root');
        } else {
            const newPath = currentPath.slice(0, index + 1);
            setCurrentPath(newPath);
            // const folderId = newPath[newPath.length - 1].id;
            // await fetchFiles(folderId);
        }
    };



    return (
        <Box bg="gray.50" height="100vh" >
            <Flex as="nav" justify="space-between" p={4} bg="blue.50" color="white" align='center'>
                <Text fontSize="lg" fontWeight="bold" color="blue.500">File Picker and Reader</Text>
                <Menu>
                    <MenuButton as={Button} color={'blue.100'}>
                        <Flex align="center" gap={2}>
                            <Box boxSize="30px">
                                <Image src={profilePic} alt="Profile" borderRadius="full" />
                            </Box>
                            <Text color="black">{name}</Text>
                        </Flex>
                    </MenuButton>
                    <MenuList>
                        <MenuItem color="black" onClick={async () => await supabase.auth.signOut()}>
                            Sign out
                        </MenuItem>
                    </MenuList>
                </Menu>

            </Flex>
            <Divider borderColor="gray.300" my={4} mt={0} mb={10} />
            {/* <Text mb={4}> */}
            <Flex flex="1" pl={20} pr={20} direction={'column'}>
                <Flex style={{ cursor: 'pointer' }} alignItems="center" gap={2} fontSize='sm' mb={5} p={4}>
                    <Flex onClick={() => handlePathClick(-1)} alignItems="center" gap={2}>
                        <Icon as={FcGoogle} color="blue.500" />
                        Google Drive
                        <Icon as={MdChevronRight} />
                    </Flex>
                    {currentPath.map((path, index) => (
                        <Flex key={index} onClick={() => handlePathClick(index)} style={{ cursor: 'pointer' }} alignItems="center" gap={2}>
                            {path.name}
                            <Icon as={MdChevronRight} />
                        </Flex>
                    ))}
                </Flex>

                {/* </Text> */}
                <Box overflowY="scroll" style={{ maxHeight: '600px' }}>
                    <Table variant="simple" size='sm' borderTop="1px solid" borderColor="gray.200" bg='white'>
                        <Thead height="50px">
                            <Tr>
                            <Th>Name</Th>
                            <Th>Size</Th>
                            <Th>Updated At</Th>
                            <Th>Select</Th>
                        </Tr>
                    </Thead>
                    {/* <Box overflowY="scroll" style={{ maxHeight: '600px' }} w="100%"> */}
                    <Tbody>
                        {files?.map((file, index) => (
                            <Tr key={index}>
                                <Td onClick={() => handleEntryClick(file)} style={{ cursor: 'pointer' }}
                                >
                                    <Flex alignItems={'center'} gap={3}>
                                        {<Icon as={file.mimeType === 'application/vnd.google-apps.folder' ? MdOutlineFolder : MdOutlineInsertDriveFile} />} {file.name}
                                    </Flex>
                                </Td>
                                {/* <Td>{file.size}</Td> */}
                                <Td>{file.size ? (Number(file.size) > 1e9 ? (Number(file.size) / 1e9).toFixed(2) + ' GB' : Number(file.size) > 1e6 ? (Number(file.size) / 1e6).toFixed(2) + ' MB' : (Number(file.size) / 1e3).toFixed(2) + ' KB') : ''}</Td>
                                <Td>{new Date(file.modifiedTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}</Td>
                                <Td>
                                    <Button onClick={() => handleFileSelect(file)}>Select</Button>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                    {/* </Box> */}
                </Table>
                </Box>
                <Button onClick={handleUpload} mt="4">Upload Selected</Button>
            </Flex>
        </Box>
    );
};

export default Home;
