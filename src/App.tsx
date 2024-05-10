import './index.css'
import { Box, Flex, Text } from '@chakra-ui/react';
import { useState, useEffect } from 'react'
// import { createClient } from '@supabase/supabase-js'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from './utils/supabase_client';
import Home from './Home';

function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session)
    }).catch(error => console.error('Error fetching session:', error));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    });
    return () => subscription.unsubscribe()
  }, [])

  if (!session) {
    return   <Flex height="100vh" width='100vw' alignItems="center" justifyContent="center" background={"blue.100"}>
    <Flex width='400px' gap={4} background={"white"} borderRadius='md' boxShadow='0 0 10px rgba(0, 0, 0, 0.5)' p={4} flexDirection="column" alignItems='center' justifyContent='center'>
      <Text fontSize='xl' as='b' color={"black"} textAlign='center'>Sign into File Picker and Reader</Text>
      <Box width="350px">
        <Auth supabaseClient={supabase} 
            appearance={{ theme: ThemeSupa }}
            providers={['google']}
            redirectTo={`${window.location.origin}`}
            queryParams={{
              prompt: 'select_account',
            }}
            providerScopes={{
              google: 'https://www.googleapis.com/auth/drive',
            }}
            onlyThirdPartyProviders={true}
            />
        </Box>
    </Flex>
  </Flex>
  }
  else {
    return (<Home />)
  }
}

export default App;