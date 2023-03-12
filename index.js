import * as core from '@actions/core';
import {Github} from "./core/Github";
import {Input} from "./core/Input";

async function run() {
    const release = await Github.getInstance().listRelease();
    core.debug(`release list data: \n${release}`)
    if (release.length <= 0) {
        core.info(`No release found, action finish!`);
        return;
    }
    core.info(`Release total count: ${release.length}`);

    if (Input.Release.DROP) {
        // const releases = release.filter((release: any) => release.prerelease);
        const releases = release.filter((release) => !(release.prerelease || release.draft));
        if (releases.length > 0) {
            core.info(`Find release count: ${releases.length}`);
            await dropRelease(releases, Input.Release.KEEP_COUNT + 1, Input.Release.DROP_TAG);
        } else {
            core.warning(`No release found, skip action.`);
        }
    } else {
        core.info(`Skip drop release.`);
    }

    if (Input.PreRelease.DROP) {
        const prereleases = release.filter((release) => release.prerelease);
        if (prereleases.length > 0) {
            core.info(`Find pre-release count: ${prereleases.length}`);
            await dropRelease(prereleases, Input.PreRelease.KEEP_COUNT + 1, Input.PreRelease.DROP_TAG);
        } else {
            core.warning(`No pre-release found, skip action.`);
        }
    } else {
        core.info(`Skip drop pre-release.`);
    }


    if (Input.Draft.DROP) {
        const draft = (await Github.getInstance().listRelease())
            .filter((release) => release.draft);
        if (draft.length > 0) {
            core.info(`Find draft count: ${draft.length}`);
            await dropRelease(draft, 0, false);
        } else {
            core.warning(`No draft found, skip action.`);
        }
    } else {
        core.info(`Skip drop draft.`);
    }

    core.info(`All task finished!`);
}

async function dropRelease(releases, keep, dropTag) {
    const sorted = releases.sort(
        function (rA, rB) {
            if (rB.published_at != null && rA.published_at){
                return rB.published_at.localeCompare(rA.published_at);
            } else {
                return rB.name.localeCompare(rA.name);
            }
        },
    )
    const github = Github.getInstance();
    for (let i = keep; i < sorted.length; i++) {
        await github.dropRelease(sorted[i], dropTag);
    }
}

run();
